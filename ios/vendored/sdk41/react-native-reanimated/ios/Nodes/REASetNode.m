#import "REASetNode.h"
#import "REAUtils.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>
#import "REAValueNode.h"
#import "REANodesManager.h"

@implementation REASetNode {
  NSNumber *_whatNodeID;
  NSNumber *_valueNodeID;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _whatNodeID = [ABI41_0_0RCTConvert NSNumber:config[@"what"]];
    REA_LOG_ERROR_IF_NIL(_whatNodeID, @"Reanimated: First argument passed to set node is either of wrong type or is missing.");
    _valueNodeID = [ABI41_0_0RCTConvert NSNumber:config[@"value"]];
    REA_LOG_ERROR_IF_NIL(_valueNodeID, @"Reanimated: Second argument passed to set node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  NSNumber *newValue = [[self.nodesManager findNodeByID:_valueNodeID] value];
  REAValueNode *what = (REAValueNode *)[self.nodesManager findNodeByID:_whatNodeID];
  [what setValue:newValue];
  return newValue;
}

@end
