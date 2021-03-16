#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0RCTOnPageScrollEvent : NSObject <ABI41_0_0RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
