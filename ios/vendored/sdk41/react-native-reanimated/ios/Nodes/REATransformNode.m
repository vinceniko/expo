#import "REATransformNode.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import "REANodesManager.h"

@implementation REATransformNode
{
  NSArray<id> *_transformConfigs;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _transformConfigs = config[@"transform"];
  }
  return self;
}

- (id)evaluate
{
  NSMutableArray<NSDictionary *> *transform = [NSMutableArray arrayWithCapacity:_transformConfigs.count];
  for (NSDictionary *transformConfig in _transformConfigs) {
    NSString *property = transformConfig[@"property"];
    REANodeID nodeID = [ABI41_0_0RCTConvert NSNumber:transformConfig[@"nodeID"]];
    NSNumber *value;
    if (nodeID) {
      REANode *node = [self.nodesManager findNodeByID:nodeID];
      value = [node value];
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property: value}];
  }

  return transform;
}

@end

