package com.saferaastaai

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.view.KeyEvent
import android.content.Intent
import android.util.Log
import android.os.Bundle
import android.view.WindowManager

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "SafeRaasta"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Turn screen on and show over lock screen
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )
    
    handleVoiceActivationIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let { handleVoiceActivationIntent(it) }
  }

  private fun handleVoiceActivationIntent(intent: Intent?) {
    if (intent?.getBooleanExtra("VOICE_ACTIVATION_TRIGGER", false) == true) {
      Log.d("MainActivity", "🎙️ Voice activation triggered by button combo")
      // Send event to React Native to start voice recognition
      val activationIntent = Intent(VoiceActivationService.BUTTON_COMBO_ACTION)
      sendBroadcast(activationIntent)
    }
  }

  /**
   * Intercept volume button presses for voice activation
   */
  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    return when (keyCode) {
      KeyEvent.KEYCODE_VOLUME_UP -> {
        Log.d("MainActivity", "Volume UP pressed")
        sendVolumeButtonPress(true)
        true
      }
      KeyEvent.KEYCODE_VOLUME_DOWN -> {
        Log.d("MainActivity", "Volume DOWN pressed")
        sendVolumeButtonPress(false)
        true
      }
      else -> super.onKeyDown(keyCode, event)
    }
  }

  private fun sendVolumeButtonPress(isVolumeUp: Boolean) {
    val intent = Intent(this, VolumeButtonReceiver::class.java)
    intent.action = if (isVolumeUp) "VOLUME_UP" else "VOLUME_DOWN"
    sendBroadcast(intent)
  }
}
