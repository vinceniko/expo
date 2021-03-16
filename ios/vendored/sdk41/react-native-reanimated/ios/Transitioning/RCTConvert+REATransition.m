#import "ABI41_0_0RCTConvert+REATransition.h"

@implementation ABI41_0_0RCTConvert (REATransition)

ABI41_0_0RCT_ENUM_CONVERTER(REATransitionType, (@{
                                         @"none": @(REATransitionTypeNone),
                                         @"group": @(REATransitionTypeGroup),
                                         @"in": @(REATransitionTypeIn),
                                         @"out": @(REATransitionTypeOut),
                                         @"change": @(REATransitionTypeChange),
                                         }), REATransitionTypeNone, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(REATransitionAnimationType, (@{
                                                  @"none": @(REATransitionAnimationTypeNone),
                                                  @"fade": @(REATransitionAnimationTypeFade),
                                                  @"scale": @(REATransitionAnimationTypeScale),
                                                  @"slide-top": @(REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(REATransitionAnimationTypeSlideLeft)
                                                  }), REATransitionAnimationTypeNone, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(REATransitionInterpolationType, (@{
                                                      @"linear": @(REATransitionInterpolationLinear),
                                                      @"easeIn": @(REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(REATransitionInterpolationEaseInOut),
                                                      }), REATransitionInterpolationLinear, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(REATransitionPropagationType, (@{
                                                    @"none": @(REATransitionPropagationNone),
                                                    @"top": @(REATransitionPropagationTop),
                                                    @"bottom": @(REATransitionPropagationBottom),
                                                    @"left": @(REATransitionPropagationLeft),
                                                    @"right": @(REATransitionPropagationRight)
                                                    }), REATransitionPropagationNone, integerValue)
@end
