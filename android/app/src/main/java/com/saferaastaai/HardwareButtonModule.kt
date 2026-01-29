package com.saferaastaai

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.BroadcastReceiver
import com.facebook.react.bridge.*

class HardwareButtonModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var broadcastReceiver: BroadcastReceiver? = null
    private var voiceActivationCallback: Callback? = null

    override fun getName(): String = "HardwareButtonModule"

    @ReactMethod
    fun startVoiceActivationService(callback: Callback) {
        try {
            val intent = Intent(reactApplicationContext, VoiceActivationService::class.java)
            reactApplicationContext.startForegroundService(intent)
            callback.invoke(null, "Voice activation service started")
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }

    @ReactMethod
    fun stopVoiceActivationService(callback: Callback) {
        try {
            val intent = Intent(reactApplicationContext, VoiceActivationService::class.java)
            intent.action = VoiceActivationService.ACTION_STOP_SERVICE
            reactApplicationContext.startService(intent)
            callback.invoke(null, "Voice activation service stopped")
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }

    @ReactMethod
    fun listenForButtonPress(callback: Callback) {
        voiceActivationCallback = callback
        
        broadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == VoiceActivationService.BUTTON_COMBO_ACTION) {
                    voiceActivationCallback?.invoke("button_combo_detected")
                }
            }
        }

        val filter = IntentFilter(VoiceActivationService.BUTTON_COMBO_ACTION)
        reactApplicationContext.registerReceiver(broadcastReceiver, filter)
    }

    @ReactMethod
    fun stopListeningForButtonPress() {
        if (broadcastReceiver != null) {
            try {
                reactApplicationContext.unregisterReceiver(broadcastReceiver)
                broadcastReceiver = null
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
