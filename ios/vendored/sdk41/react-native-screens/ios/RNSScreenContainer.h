#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

@protocol RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@protocol RNScreensViewControllerDelegate

@end

@interface RNScreensViewController: UIViewController <RNScreensViewControllerDelegate>

@end

@interface RNSScreenContainerView : UIView <RNSScreenContainerDelegate>

@end
