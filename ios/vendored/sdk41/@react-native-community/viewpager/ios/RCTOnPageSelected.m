#import <ABI41_0_0React/UIView+ABI41_0_0React.h>
#import "ABI41_0_0RCTOnPageSelected.h"

@implementation ABI41_0_0RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI41_0_0RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI41_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return _coalescingKey;
}


- (BOOL)canCoalesce
{
    return NO;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI41_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI41_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<ABI41_0_0RCTEvent>)coalesceWithEvent:(id<ABI41_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end

