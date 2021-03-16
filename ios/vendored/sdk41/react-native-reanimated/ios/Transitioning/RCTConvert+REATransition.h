#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>

#import "REATransition.h"

@interface ABI41_0_0RCTConvert (REATransition)

+ (REATransitionType)REATransitionType:(id)json;
+ (REATransitionAnimationType)REATransitionAnimationType:(id)json;
+ (REATransitionInterpolationType)REATransitionInterpolationType:(id)json;
+ (REATransitionPropagationType)REATransitionPropagationType:(id)json;

@end
