package com.upiapplauncher

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import java.io.ByteArrayOutputStream

/**
 * Native module for UPI App Launcher
 * Supports both Old Architecture and New Architecture (TurboModule)
 * Uses the Codegen-generated spec interface
 */
@ReactModule(name = NativeUpiAppLauncherSpec.NAME)
class UpiAppLauncherModule(reactContext: ReactApplicationContext) :
    NativeUpiAppLauncherSpec(reactContext) {

    companion object {
        private const val TAG = "UpiAppLauncher"
        private const val ICON_SIZE_DP = 48
        private const val REQUEST_CODE_LAUNCH_UPI = 1001
    }

    /**
     * Convert Drawable to base64 PNG string
     */
    private fun drawableToBase64(drawable: Drawable): String? {
        return try {
            val bitmap = drawableToBitmap(drawable)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            val byteArray = outputStream.toByteArray()
            Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Error converting drawable to base64", e)
            null
        }
    }

    /**
     * Convert Drawable to Bitmap
     */
    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        return if (drawable is BitmapDrawable && drawable.bitmap != null) {
            drawable.bitmap
        } else {
            val density = reactApplicationContext.resources.displayMetrics.density
            val width = (ICON_SIZE_DP * density).toInt()
            val height = (ICON_SIZE_DP * density).toInt()

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bitmap
        }
    }

    /**
     * Check if a UPI app supports subscription/autopay (mandate)
     * by checking if it can handle upi://mandate scheme
     */
    private fun checkSupportsMandate(packageManager: PackageManager, packageName: String): Boolean {
        return try {
            val mandateIntent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("upi://mandate")
                setPackage(packageName)
            }
            mandateIntent.resolveActivity(packageManager) != null
        } catch (e: Exception) {
            Log.d(TAG, "Error checking mandate support for $packageName", e)
            false
        }
    }

    private var launchPromise: Promise? = null

    /**
     * Handle activity result callback
     */
    private fun handleActivityResult(resultCode: Int, data: Intent?) {
        launchPromise?.let { promise ->
            launchPromise = null // Clear immediately to prevent double handling

            val resultMap = Arguments.createMap()

            when (resultCode) {
                Activity.RESULT_OK -> {
                    resultMap.putInt("resultCode", 0) // Success
                    data?.dataString?.let { dataString ->
                        resultMap.putString("data", dataString)
                    }
                }
                Activity.RESULT_CANCELED -> {
                    resultMap.putInt("resultCode", 1) // Canceled
                }
                else -> {
                    resultMap.putInt("resultCode", 2) // Failed
                }
            }

            promise.resolve(resultMap)
        }
    }

    /**
     * ActivityEventListener for handling activity results
     */
    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            // Only handle our specific request code to avoid conflicts
            if (requestCode == REQUEST_CODE_LAUNCH_UPI) {
                handleActivityResult(resultCode, data)
            }
        }
    }

    init {
        reactApplicationContext.addActivityEventListener(activityEventListener)
    }

    /**
     * Clean up resources when module is destroyed
     * Note: This method is deprecated but still needed for proper cleanup
     */
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        // Reject any pending promise to prevent memory leaks
        launchPromise?.let { promise ->
            launchPromise = null
            promise.reject(
                "MODULE_DESTROYED",
                "Module was destroyed before activity result was received"
            )
        }
        reactApplicationContext.removeActivityEventListener(activityEventListener)
    }

    /**
     * Get list of installed UPI apps
     */
    @ReactMethod
    override fun getInstalledUpiApps(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val upiIntent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("upi://pay")
            }

            val resolveInfoList = packageManager.queryIntentActivities(
                upiIntent, PackageManager.MATCH_DEFAULT_ONLY
            )

            val appList: WritableArray = Arguments.createArray()

            for (resolveInfo in resolveInfoList) {
                try {
                    val packageName = resolveInfo.activityInfo.packageName
                    val appName = resolveInfo.loadLabel(packageManager).toString()
                    val appMap: WritableMap = Arguments.createMap()
                    appMap.putString("packageName", packageName)
                    appMap.putString("appName", appName)

                    // Check if app supports subscription/autopay (upi://mandate)
                    val supportsSubscription = checkSupportsMandate(packageManager, packageName)
                    appMap.putBoolean("supportsSubscription", supportsSubscription)

                    // Get app icon and convert to base64
                    try {
                        val icon = resolveInfo.loadIcon(packageManager)
                        drawableToBase64(icon)?.let { iconBase64 ->
                            appMap.putString("icon", "data:image/png;base64,$iconBase64")
                        }
                    } catch (e: Exception) {
                        Log.d(TAG, "Could not load icon for $packageName", e)
                    }

                    appList.pushMap(appMap)
                } catch (e: Exception) {
                    Log.d(TAG, "Error processing package", e)
                }
            }

            promise.resolve(appList)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting installed UPI apps", e)
            promise.reject(
                "ERROR_GETTING_UPI_APPS",
                "Failed to get installed UPI apps: ${e.message}",
                e
            )
        }
    }

    /**
     * Launch UPI app with the given URL
     */
    @ReactMethod
    override fun launchUpiApp(packageName: String, url: String, promise: Promise) {
        try {
            val currentActivity = reactApplicationContext.currentActivity
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No current activity found")
                return
            }

            // Store promise for activity result callback
            launchPromise = promise

            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse(url)
                if (packageName.isNotEmpty()) {
                    setPackage(packageName)
                }
            }

            // Verify that the app can handle this intent
            val packageManager = reactApplicationContext.packageManager
            if (intent.resolveActivity(packageManager) == null) {
                launchPromise = null
                promise.reject(
                    "APP_NOT_FOUND",
                    if (packageName.isNotEmpty()) {
                        "UPI app not found or cannot handle the intent"
                    } else {
                        "No UPI app found to handle the intent"
                    }
                )
                return
            }

            currentActivity.startActivityForResult(intent, REQUEST_CODE_LAUNCH_UPI)
        } catch (e: Exception) {
            Log.e(TAG, "Error launching UPI app", e)
            launchPromise = null
            promise.reject(
                "ERROR_LAUNCHING_UPI_APP",
                "Failed to launch UPI app: ${e.message}",
                e
            )
        }
    }
}
