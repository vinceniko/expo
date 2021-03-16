#import "REACondNode.h"
#import "REANodesManager.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import "REAUtils.h"
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@implementation REACondNode {
  NSNumber *_condNodeID;
  NSNumber *_ifBlockID;
  NSNumber *_elseBlockID;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _condNodeID = [ABI41_0_0RCTConvert NSNumber:config[@"cond"]];
    REA_LOG_ERROR_IF_NIL(_condNodeID, @"Reanimated: First argument passed to cond node is either of wrong type or is missing.");
    _ifBlockID = [ABI41_0_0RCTConvert NSNumber:config[@"ifBlock"]];
    REA_LOG_ERROR_IF_NIL(_ifBlockID, @"Reanimated: Second argument passed to cond node is either of wrong type or is missing.");
    _elseBlockID = [ABI41_0_0RCTConvert NSNumber:config[@"elseBlock"]];
  }
  return self;
}

- (id)evaluate
{
  id cond = [[self.nodesManager findNodeByID:_condNodeID] value];
  if ([cond doubleValue]) {
    return [[self.nodesManager findNodeByID:_ifBlockID] value];
  }
  return _elseBlockID != nil ? [[self.nodesManager findNodeByID:_elseBlockID] value] : @(0);
}

@end
