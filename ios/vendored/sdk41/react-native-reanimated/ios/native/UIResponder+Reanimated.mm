#import "UIResponder+Reanimated.h"
#import <ABI41_0_0React/ABI41_0_0RCTCxxBridgeDelegate.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAModule.h>
#import <ABI41_0_0ReactCommon/ABI41_0_0RCTTurboModuleManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTCxxBridgeDelegate.h>
#import <RNReanimated/REAEventDispatcher.h>

#if RNVERSION >= 64
#import <ABI41_0_0React/ABI41_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ABI41_0_0ReactCommon/BridgeJSCallInvoker.h>
#endif

#if __has_include(<ABI41_0_0React/HermesExecutorFactory.h>)
#import <ABI41_0_0React/HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI41_0_0React/JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@interface ABI41_0_0RCTEventDispatcher(Reanimated)

- (void)setBridge:(ABI41_0_0RCTBridge*)bridge;

@end

@implementation UIResponder (Reanimated)
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI41_0_0RCTBridge *)bridge
{
  [bridge moduleForClass:[ABI41_0_0RCTEventDispatcher class]];
  ABI41_0_0RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
   _bridge_reanimated = bridge;
  __weak __typeof(self) weakSelf = self;

  const auto executor = [weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
#if RNVERSION >= 63
      auto reanimatedModule = reanimated::createReanimatedModule(bridge.jsCallInvoker);
#else
      auto callInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
      auto reanimatedModule = reanimated::createReanimatedModule(callInvoker);
#endif
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule));
    }
  };

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI41_0_0RCTJSIExecutorRuntimeInstaller(executor));
#else
  return std::make_unique<ExecutorFactory>(executor);
#endif
}

@end

#endif
