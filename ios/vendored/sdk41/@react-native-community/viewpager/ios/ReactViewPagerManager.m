
#import "ABI41_0_0ReactViewPagerManager.h"

@implementation ABI41_0_0ReactViewPagerManager

#pragma mark - RTC

ABI41_0_0RCT_EXPORT_MODULE(ABI41_0_0RNCViewPager)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)


- (void) goToPage
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI41_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI41_0_0ReactNativePageView *view = (ABI41_0_0ReactNativePageView *)viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ABI41_0_0ReactNativePageView class]]) {
            ABI41_0_0RCTLogError(@"Cannot find ABI41_0_0ReactNativePageView with tag #%@", reactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)reactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI41_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI41_0_0ReactNativePageView *view = (ABI41_0_0ReactNativePageView *)viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ABI41_0_0ReactNativePageView class]]) {
            ABI41_0_0RCTLogError(@"Cannot find ABI41_0_0ReactNativePageView with tag #%@", reactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI41_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:reactTag index:index animated:true];
}

ABI41_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:reactTag index:index animated:false];
}

ABI41_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)reactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:reactTag enabled:isEnabled];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI41_0_0ReactNativePageView) {
    [view shouldScroll:[ABI41_0_0RCTConvert BOOL:json]];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI41_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI41_0_0RCTConvert NSString:json]];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI41_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI41_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI41_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
