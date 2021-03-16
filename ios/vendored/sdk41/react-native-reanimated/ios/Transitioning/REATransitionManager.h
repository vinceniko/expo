#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

@interface REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI41_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)reactTag withConfig:(NSDictionary *)config;

@end
