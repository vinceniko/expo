#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0RCTOnPageScrollStateChanged : NSObject <ABI41_0_0RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
