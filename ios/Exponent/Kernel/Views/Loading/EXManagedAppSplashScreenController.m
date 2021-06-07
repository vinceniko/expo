//
//  EXManagedAppSplashScreenController.m
//  Expo Go (unversioned)
//
//  Created by andrew on 2021-06-07.
//  Copyright © 2021 650 Industries. All rights reserved.
//

#import "EXManagedAppSplashScreenController.h"
#import "MBProgressHUD.h"
#import "EXSplashScreenHUDButton.h"


@interface EXManagedAppSplashScreenController()

@property (nonatomic, weak) NSTimer *warningTimer;
@property (nonatomic, weak) MBProgressHUD *warningHud;

@end

@implementation EXManagedAppSplashScreenController

- (void)showWithCallback:(void (^)(void))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  [self startSplashScreenVisibleTimer];
  [super showWithCallback:successCallback failureCallback:failureCallback];
}

- (void)hideWithCallback:(void (^)(BOOL))successCallback failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (self.warningTimer) {
    [self.warningTimer invalidate];
  }

  [super hideWithCallback:successCallback failureCallback:failureCallback];
}


-(void)startSplashScreenVisibleTimer
{
  self.warningTimer = [NSTimer scheduledTimerWithTimeInterval:20.0
                                                       target:self
                                                     selector:@selector(showSplashScreenVisibleWarning)
                                                     userInfo:nil
                                                      repeats:NO];
}

-(void)showSplashScreenVisibleWarning
{
#if DEBUG
  _warningHud = [MBProgressHUD showHUDAddedTo: self.splashScreenView animated:YES];
  _warningHud.mode = MBProgressHUDModeCustomView;
  
  EXSplashScreenHUDButton *button = [EXSplashScreenHUDButton buttonWithType: UIButtonTypeSystem];
  [button addTarget:self action:@selector(navigateToFYI) forControlEvents:UIControlEventTouchUpInside];

  _warningHud.customView = button;
  _warningHud.offset = CGPointMake(0.f, MBProgressMaxOffset);
  
  [_warningHud hideAnimated:YES afterDelay:8.f];
#endif
}

-(void)navigateToFYI
{
  NSURL *fyiURL = [[NSURL alloc] initWithString:@"https://expo.fyi/splash-screen-hanging"];
  [[UIApplication sharedApplication] openURL:fyiURL];
  [_warningHud hideAnimated: YES];
}

@end
