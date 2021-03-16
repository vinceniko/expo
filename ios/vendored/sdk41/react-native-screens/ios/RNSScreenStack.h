#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerObserverCoordinator.h>

#import "RNSScreenContainer.h"

@interface RNScreensNavigationController: UINavigationController <RNScreensViewControllerDelegate>

@end

@interface RNSScreenStackView : UIView <RNSScreenContainerDelegate, ABI41_0_0RCTInvalidating>

@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface RNSScreenStackManager : ABI41_0_0RCTViewManager <ABI41_0_0RCTInvalidating>

@end
