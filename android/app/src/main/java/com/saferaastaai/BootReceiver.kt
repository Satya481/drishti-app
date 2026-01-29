package com.saferaastaai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            Log.d("BootReceiver", "📱 Device booted or app updated - starting Voice Activation Service")
            
            try {
                val serviceIntent = Intent(context, VoiceActivationService::class.java)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                
                Log.d("BootReceiver", "✅ Voice Activation Service started successfully")
            } catch (e: Exception) {
                Log.e("BootReceiver", "❌ Error starting Voice Activation Service: ${e.message}")
            }
        }
    }
}
