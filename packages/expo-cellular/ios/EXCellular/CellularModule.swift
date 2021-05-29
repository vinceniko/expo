
import CoreTelephony
import UMCore

// Keep this enum in sync with JavaScript
// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
enum CellularGeneration: Int {
  case unknown = 0
  case cellular2G = 1
  case cellular3G = 2
  case cellular4G = 3
}

open class CellularModule: Module {
  public let name: String = "ExpoCellular"

  public override func constants() -> [String : Any?] {
    let carrier = currentCarrier()

    return [
      "allowsVoip": carrier?.allowsVOIP,
      "carrier": carrier?.carrierName,
      "isoCountryCode": carrier?.isoCountryCode,
      "mobileCountryCode": carrier?.mobileCountryCode,
      "mobileNetworkCode": carrier?.mobileNetworkCode
    ]
  }

  public override func methods() -> [AnyMethod] {
    return [
      Method("getCellularGenerationAsync") {
        self.currentCellularGeneration()
      }
    ]
  }

  //MARK: internals

  func currentCellularGeneration() -> CellularGeneration {
    let radioAccessTechnology = currentRadioAccessTechnology()

    switch radioAccessTechnology {
    case CTRadioAccessTechnologyGPRS,
         CTRadioAccessTechnologyEdge,
         CTRadioAccessTechnologyCDMA1x:
      return .cellular2G
    case CTRadioAccessTechnologyWCDMA,
         CTRadioAccessTechnologyHSDPA,
         CTRadioAccessTechnologyHSUPA,
         CTRadioAccessTechnologyCDMAEVDORev0,
         CTRadioAccessTechnologyCDMAEVDORevA,
         CTRadioAccessTechnologyCDMAEVDORevB,
         CTRadioAccessTechnologyeHRPD:
      return .cellular3G
    case CTRadioAccessTechnologyLTE:
      return .cellular4G
    default:
      return .unknown
    }
  }

  func currentRadioAccessTechnology() -> String? {
    let netinfo = CTTelephonyNetworkInfo()

    if #available(iOS 12.0, *) {
      return netinfo.serviceCurrentRadioAccessTechnology?.values.first
    } else {
      return netinfo.currentRadioAccessTechnology
    }
  }

  func currentCarrier() -> CTCarrier? {
    let netinfo = CTTelephonyNetworkInfo()

    if #available(iOS 12.0, *), let providers = netinfo.serviceSubscriberCellularProviders {
      for carrier in providers.values {
        if carrier.carrierName != nil {
          return carrier
        }
      }
      return providers.values.first
    }
    return netinfo.subscriberCellularProvider
  }
}
