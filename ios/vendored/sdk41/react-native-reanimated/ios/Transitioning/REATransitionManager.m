#import "REATransitionManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerObserverCoordinator.h>

#import "REATransition.h"

@interface REATransitionManager () <ABI41_0_0RCTUIManagerObserver>
@end

@implementation REATransitionManager {
  REATransition *_pendingTransition;
  UIView *_pendingTransitionRoot;
  ABI41_0_0RCTUIManager *_uiManager;
}

- (instancetype)initWithUIManager:(id)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (void)beginTransition:(REATransition *)transition forView:(UIView *)view
{
  ABI41_0_0RCTAssertMainQueue();
  if (_pendingTransition != nil) {
    return;
  }
  _pendingTransition = transition;
  _pendingTransitionRoot = view;
  [transition startCaptureInRoot:view];
}

- (void)uiManagerWillPerformMounting:(ABI41_0_0RCTUIManager *)manager
{
  [manager addUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [_pendingTransition playInRoot:_pendingTransitionRoot];
    _pendingTransitionRoot = nil;
    _pendingTransition = nil;
  }];
}

- (void)animateNextTransitionInRoot:(NSNumber *)reactTag withConfig:(NSDictionary *)config
{
  [_uiManager.observerCoordinator addObserver:self];
  [_uiManager prependUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    NSArray *transitionConfigs = [ABI41_0_0RCTConvert NSArray:config[@"transitions"]];
    for (id transitionConfig in transitionConfigs) {
      REATransition *transition = [REATransition inflate:transitionConfig];
      [self beginTransition:transition forView:view];
    }
  }];
  __weak id weakSelf = self;
  [_uiManager addUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [uiManager.observerCoordinator removeObserver:weakSelf];
  }];
}

@end
