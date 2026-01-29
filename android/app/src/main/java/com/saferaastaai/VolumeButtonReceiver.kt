package com.saferaastaai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class VolumeButtonReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("VolumeButtonReceiver", "Broadcast received: ${intent?.action}")
        
        val isVolumeUp = intent?.action == "VOLUME_UP"
        
        // Get the VoiceActivationService instance if running
        context?.let {
            try {
                // We'll use a static reference in the service
                VolumeButtonListener.onVolumeButtonPressed(isVolumeUp)
            } catch (e: Exception) {
                Log.e("VolumeButtonReceiver", "Error handling volume button", e)
            }
        }
    }
}

object VolumeButtonListener {
    private var service: VoiceActivationService? = null
    
    fun setService(voiceService: VoiceActivationService) {
        service = voiceService
    }
    
    fun onVolumeButtonPressed(isVolumeUp: Boolean) {
        service?.onVolumeButtonPressed(isVolumeUp)
    }
}
