package host.exp.exponent.kernel

import expo.modules.updates.manifest.ManifestFactory
import expo.modules.updates.manifest.raw.RawManifest
import host.exp.exponent.storage.ExponentDB
import org.json.JSONException
import org.json.JSONObject
import java.io.UnsupportedEncodingException
import java.net.URLEncoder

data class ExperienceKey(
  val legacyId: String,
  val stableLegacyId: String,
  val scopeKey: String
) {
  @Throws(UnsupportedEncodingException::class)
  fun getUrlEncodedStableLegacyId(): String = URLEncoder.encode(stableLegacyId, "UTF-8")

  @Throws(UnsupportedEncodingException::class)
  fun getUrlEncodedScopeKey(): String = URLEncoder.encode(scopeKey, "UTF-8")

  companion object {
    @Throws(JSONException::class)
    @JvmStatic fun fromRawManifest(rawManifest: RawManifest): ExperienceKey {
      return ExperienceKey(
        rawManifest.getLegacyID(),
        rawManifest.getStableLegacyID(),
        rawManifest.getScopeKey()
      )
    }

    /**
     * Best effort load an ExperienceKey from an experienceId in a context in which only the
     * experienceId is available. Note that this will fall back to an ExperienceKey with the
     * experienceId value in legacyId, stableLegacyId, and scopeKey when an experience isn't
     * found in the database.
     */
    @Deprecated(message = "This loads the full manifest from the database. Only use in circumstances where an ExperienceKey is not yet available.")
    @JvmStatic fun loadForExperienceScopeKey(experienceScopeKey: String): ExperienceKey {
      val experience = ExponentDB.experienceScopeKeyToExperienceSync(experienceScopeKey)
      if (experience != null) {
        try {
          return fromRawManifest(ManifestFactory.getRawManifestFromJson(JSONObject(experience.manifest)))
        } catch (e: JSONException) {
          // fall through to fallback experienceKey construction below
        }
      }

      // fallback experienceKey, only should be used
      return ExperienceKey(
        experienceScopeKey,
        experienceScopeKey,
        experienceScopeKey
      )
    }
  }
}
