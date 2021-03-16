#import <Foundation/Foundation.h>

#import "REANode.h"
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

@class REAModule;

typedef void (^REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^REANativeAnimationOp)(ABI41_0_0RCTUIManager *uiManager);
typedef void (^REAEventHandler)(NSString *eventName, id<ABI41_0_0RCTEvent> event);

@interface REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI41_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(REAModule *)reanimatedModule
                             uiManager:(nonnull ABI41_0_0RCTUIManager *)uiManager;

- (REANode* _Nullable)findNodeByID:(nonnull REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)registerEventHandler:(REAEventHandler)eventHandler;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (void)getValue:(REANodeID)nodeID
        callback:(ABI41_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull REANodeID)tag;

- (void)connectNodes:(nonnull REANodeID)parentID
             childID:(nonnull REANodeID)childID;

- (void)disconnectNodes:(nonnull REANodeID)parentID
                childID:(nonnull REANodeID)childID;

- (void)connectNodeToView:(nonnull REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;

- (NSString*)obtainProp:(nonnull NSNumber *)viewTag
          propName:(nonnull NSString *)propName;

// events

- (void)dispatchEvent:(id<ABI41_0_0RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

@end
