#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>
#import <ABI41_0_0React/ABI41_0_0RCTComponent.h>

#import "RNSScreenContainer.h"

@class RNSScreenContainerView;

typedef NS_ENUM(NSInteger, RNSScreenStackPresentation) {
  RNSScreenStackPresentationPush,
  RNSScreenStackPresentationModal,
  RNSScreenStackPresentationTransparentModal,
  RNSScreenStackPresentationContainedModal,
  RNSScreenStackPresentationContainedTransparentModal,
  RNSScreenStackPresentationFullScreenModal,
  RNSScreenStackPresentationFormSheet
};

typedef NS_ENUM(NSInteger, RNSScreenStackAnimation) {
  RNSScreenStackAnimationDefault,
  RNSScreenStackAnimationNone,
  RNSScreenStackAnimationFade,
  RNSScreenStackAnimationFlip,
};

typedef NS_ENUM(NSInteger, RNSScreenReplaceAnimation) {
  RNSScreenReplaceAnimationPop,
  RNSScreenReplaceAnimationPush,
};

typedef NS_ENUM(NSInteger, RNSActivityState) {
  RNSActivityStateInactive = 0,
  RNSActivityStateTransitioningOrBelowTop = 1,
  RNSActivityStateOnTop = 2
};

@interface ABI41_0_0RCTConvert (RNSScreen)

+ (RNSScreenStackPresentation)RNSScreenStackPresentation:(id)json;
+ (RNSScreenStackAnimation)RNSScreenStackAnimation:(id)json;

@end

@interface RNSScreen : UIViewController <RNScreensViewControllerDelegate>

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@interface RNSScreenManager : ABI41_0_0RCTViewManager

@end

@interface RNSScreenView : ABI41_0_0RCTView

@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onAppear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onDismissed;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onWillAppear;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onWillDisappear;
@property (weak, nonatomic) UIView<RNSScreenContainerDelegate> *reactSuperview;
@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, readonly) BOOL dismissed;
@property (nonatomic) int activityState;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) RNSScreenStackAnimation stackAnimation;
@property (nonatomic) RNSScreenStackPresentation stackPresentation;
@property (nonatomic) RNSScreenReplaceAnimation replaceAnimation;

- (void)notifyFinishTransitioning;

@end

@interface UIView (RNSScreen)
- (UIViewController *)parentViewController;
@end
