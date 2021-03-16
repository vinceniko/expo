#import "REANode.h"

#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>

@interface REAEventNode : REANode

- (void)processEvent:(id<ABI41_0_0RCTEvent>)event;

@end
