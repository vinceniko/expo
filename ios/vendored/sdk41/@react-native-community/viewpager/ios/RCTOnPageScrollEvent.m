#import <ABI41_0_0React/UIView+ABI41_0_0React.h>
#import "ABI41_0_0RCTOnPageScrollEvent.h"

@implementation ABI41_0_0RCTOnPageScrollEvent
{
    NSNumber* _position;
    NSNumber* _offset;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScroll";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;
{
    ABI41_0_0RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _offset = offset;
    }
    return self;
}

ABI41_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return 0;
}


- (BOOL)canCoalesce
{
    return YES;
}

+ (NSString *)moduleDotMethod
{
    return @"ABI41_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI41_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 @"offset": _offset
                 }];
}

- (id<ABI41_0_0RCTEvent>)coalesceWithEvent:(id<ABI41_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end
