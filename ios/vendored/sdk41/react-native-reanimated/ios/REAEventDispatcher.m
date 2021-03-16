#import "REAEventDispatcher.h"
#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <RNReanimated/REAModule.h>

@implementation REAEventDispatcher

- (void)sendEvent:(id<ABI41_0_0RCTEvent>)event
{
  [[_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI41_0_0RCTEventDispatcher class]);
}

@end
