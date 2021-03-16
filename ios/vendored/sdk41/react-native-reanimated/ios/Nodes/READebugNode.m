#import "READebugNode.h"
#import "REAUtils.h"
#import "REANodesManager.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@implementation READebugNode {
  NSNumber *_valueNodeID;
  NSString *_message;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _message = [ABI41_0_0RCTConvert NSString:config[@"message"]];
    _valueNodeID = [ABI41_0_0RCTConvert NSNumber:config[@"value"]];
    REA_LOG_ERROR_IF_NIL(_valueNodeID, @"Reanimated: Second argument passed to debug node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  id value = [[self.nodesManager findNodeByID:_valueNodeID] value];
  NSLog(@"%@ %@", _message, value);
  return value;
}

@end
