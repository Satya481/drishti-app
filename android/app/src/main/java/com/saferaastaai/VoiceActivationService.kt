package com.saferaastaai

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.util.concurrent.CopyOnWriteArrayList

class VoiceActivationService : Service() {
    private val CHANNEL_ID = "voice_activation_channel"
    private val NOTIFICATION_ID = 1001
    
    private var audioManager: AudioManager? = null
    private var lastVolumeChangeTime: Long = 0
    private var lastRecordedVolume: Int = 0
    private var volumePressSequence = CopyOnWriteArrayList<String>()
    private var wakeLock: PowerManager.WakeLock? = null
    
    companion object {
        const val BUTTON_COMBO_ACTION = "com.saferaastaai.VOICE_ACTIVATION_TRIGGERED"
        const val ACTION_STOP_SERVICE = "com.saferaastaai.STOP_SERVICE"
        const val VOLUME_UP = "UP"
        const val VOLUME_DOWN = "DOWN"
        const val SEQUENCE_TIMEOUT = 3000L // 3 seconds to complete sequence
        const val PRESS_DELAY = 150L // Min delay between presses
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        
        // Initialize wake lock
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "SafeRaasta::VoiceActivationWakeLock"
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_SERVICE -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }
        
        startForegroundService()
        initializeVolumeListener()
        // Register this service to listen for volume button presses
        VolumeButtonListener.setService(this)
        
        return START_STICKY
    }

    private fun startForegroundService() {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SafeRaasta Voice Activation")
            .setContentText("🎙️ Press Vol+3x then Vol-3x to activate")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun initializeVolumeListener() {
        // Store initial volume to detect changes
        lastRecordedVolume = audioManager?.getStreamVolume(AudioManager.STREAM_MUSIC) ?: 0
    }

    fun onVolumeButtonPressed(isVolumeUp: Boolean) {
        val currentTime = System.currentTimeMillis()
        
        // Check if we should reset the sequence (timeout)
        if (currentTime - lastVolumeChangeTime > SEQUENCE_TIMEOUT) {
            volumePressSequence.clear()
        }
        
        // Check minimum press delay to avoid duplicates
        if (currentTime - lastVolumeChangeTime < PRESS_DELAY) {
            return
        }
        
        lastVolumeChangeTime = currentTime
        
        // Add to sequence
        val pressType = if (isVolumeUp) VOLUME_UP else VOLUME_DOWN
        volumePressSequence.add(pressType)
        
        android.util.Log.d("VoiceActivation", "Button pressed: $pressType, Sequence: $volumePressSequence")
        
        // Check if we have the correct sequence: UP UP UP DOWN DOWN DOWN
        if (volumePressSequence.size >= 6) {
            val sequence = volumePressSequence.takeLast(6)
            if (sequence == listOf(VOLUME_UP, VOLUME_UP, VOLUME_UP, VOLUME_DOWN, VOLUME_DOWN, VOLUME_DOWN)) {
                android.util.Log.d("VoiceActivation", "✅ Button combo detected!")
                triggerVoiceActivation()
                volumePressSequence.clear()
            }
        }
    }

    private fun triggerVoiceActivation() {
        android.util.Log.d("VoiceActivation", "🚨 Triggering voice activation - waking up device")
        
        // Wake up the screen
        try {
            if (wakeLock?.isHeld == false) {
                wakeLock?.acquire(10000) // Wake for 10 seconds
                android.util.Log.d("VoiceActivation", "✅ Wake lock acquired")
            }
        } catch (e: Exception) {
            android.util.Log.e("VoiceActivation", "❌ Failed to acquire wake lock: ${e.message}")
        }
        
        // Launch MainActivity and start voice recognition
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                   Intent.FLAG_ACTIVITY_CLEAR_TOP or
                   Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("VOICE_ACTIVATION_TRIGGER", true)
        }
        startActivity(launchIntent)
        
        // Also send broadcast for existing listeners
        val intent = Intent(BUTTON_COMBO_ACTION)
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Voice Activation Service",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Service for background voice activation"
                enableVibration(false)
            }
            
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        volumePressSequence.clear()
        
        // Release wake lock
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            android.util.Log.e("VoiceActivation", "Error releasing wake lock: ${e.message}")
        }
        
        // Restart service if it was not explicitly stopped
        android.util.Log.d("VoiceActivation", "🔄 Service destroyed - will restart automatically")
    }
    
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        android.util.Log.d("VoiceActivation", "📱 App removed from recent tasks - service continues running")
        
        // Restart the service to ensure it keeps running
        val restartServiceIntent = Intent(applicationContext, VoiceActivationService::class.java)
        applicationContext.startService(restartServiceIntent)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
