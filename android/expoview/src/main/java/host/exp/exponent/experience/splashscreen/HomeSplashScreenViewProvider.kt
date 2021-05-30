package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.view.View
import expo.modules.splashscreen.SplashScreenView
import expo.modules.splashscreen.SplashScreenViewProvider

class HomeSplashScreenViewProvider () : SplashScreenViewProvider {
    private lateinit var splashScreenView: SplashScreenView

    override fun createSplashScreenView(context: Context): View {
        splashScreenView = SplashScreenView(context)
        return splashScreenView
    }
}
