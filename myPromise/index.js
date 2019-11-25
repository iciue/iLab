/**
 * 参考 promise A+ 规范, 实现自己的 promise
 * TODO:
 *  1. 值穿透 ✔️
 *  2. 链式调用 ✔️
 *  3. 和其他 promise 交互
 *  4. all ✔️
 *  5. race ✔️
 *  6. finally ✔️
 */

const STATUS = {
  PENDING: 'pending',
  FULFILLED: 'resolved',
  REJECTED: 'rejected'
}

class MyPromise {
  constructor(exec) {
    this.status = STATUS.PENDING
    this.value = null

    this.resolvedCallbacks = []
    this.rejectedCallbacks = []

    const resolve = this.resolve.bind(this)
    const reject = this.reject.bind(this)

    try {
      exec(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  then(fulfilledHandler, rejectedHandler) {
    typeof fulfilledHandler === 'function' || (fulfilledHandler =  v => v)
    typeof rejectedHandler === 'function' || (rejectedHandler =  (e) => { throw e })

    if (this.status === STATUS.PENDING) {
      return new MyPromise((resolve, reject) => {
        this.resolvedCallbacks.push(() => {
          try {
            const x = fulfilledHandler(this.value)
            return x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
          } catch (error) {
            reject(error)
          }
        })

        this.rejectedCallbacks.push(() => {
          try {
            const x = rejectedHandler(this.value)
            return x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
          } catch (error) {
            reject(error)
          }
        })

      })
    }

    if (this.status === STATUS.FULFILLED) {
      return new MyPromise((resolve, reject) => {
        try {
          const x = fulfilledHandler(this.value)
          x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      })
    }

    if (this.status === STATUS.REJECTED) {
      return new MyPromise((resolve, reject) => {
        try {
          const x = rejectedHandler(this.value)
          x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      })
    }

  }

  resolve(value) {
    if (this.status !== STATUS.PENDING) return;
    this.value = value
    this.STATUS = STATUS.FULFILLED
    this.resolvedCallbacks.forEach(cb => setTimeout(() => cb(), 0))
  }

  reject(reason) {
    if (this.status !== STATUS.PENDING) return;
    this.value = reason
    this.status = STATUS.REJECTED
    this.rejectedCallbacks.forEach(cb => setTimeout(() => cb(), 0))
  }

}

MyPromise.prototype.all = function(args) {
  return new MyPromise((resolve, reject) => {
    const max = args.length
    const ret = []
    let count = 0

    for (const p of args) {
      p.then(res => {
        ret.push(res)
        ++count === max && resolve(ret)
      })
    }
  })
}

MyPromise.prototype.race = function(args) {
  return new MyPromise((resolve, reject) => {
    for (const p of args) {
      p.then(res => resolve(res)).catch(reject)
    }
  })
}

MyPromise.prototype.finally = function(func) {
  this.resolvedCallbacks.push(func)
  this.rejectedCallbacks.push(func)
}


new MyPromise((resolve, reject) => {
    console.log(`hi`);
    setTimeout(() => {
      resolve(1)
      // reject(222)
    }, 500);
  })
  .then(v => {
    console.log(v);
    v = v + 1
    return v
  })
  .then(console.log)
// .catch(console.log)
// .then(console.log, console.log)
// .finally(r => {
//   console.log('finally');
//   console.log(r);
// })