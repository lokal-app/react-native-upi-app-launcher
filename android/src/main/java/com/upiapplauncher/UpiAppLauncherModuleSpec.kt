package com.upiapplauncher

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.TurboModule

/**
 * TurboModule spec for New Architecture support
 * This allows the module to work with both old and new architecture
 */
abstract class UpiAppLauncherModuleSpec(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TurboModule {
    
    companion object {
        const val NAME = "UpiAppLauncher"
    }

    override fun getName(): String = NAME

    @ReactMethod
    abstract fun getInstalledUpiApps(promise: Promise)

    @ReactMethod
    abstract fun launchUpiApp(packageName: String, url: String, promise: Promise)
}



