#import <Foundation/Foundation.h>

#define REA_LOG_ERROR_IF_NIL(value, errorMsg) ({\
  if (value == nil) ABI41_0_0RCTLogError(errorMsg);\
})
