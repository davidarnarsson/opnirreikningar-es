const { Observable } = require("rxjs/Observable");
const { BehaviorSubject } = require("rxjs/BehaviorSubject");

require("rxjs/add/observable/interval");
require("rxjs/add/operator/timeout");
require("rxjs/add/operator/zip");
require("rxjs/add/operator/map");
require("rxjs/add/operator/merge");
require("rxjs/add/operator/do");

function assert(statement, message = `Assert ${statement.toString()} failed!`) {
  if (!statement) throw new Error(message);
}

class Subject {
  constructor() {
    this._subject = new BehaviorSubject([]);
  }

  next(val) {
    this._subject.next(val);
    return this;
  }

  asObservable() {
    return this._subject.asObservable();
  }

  complete() {
    this._subject.complete();
  }

  processSingleCallback(cb) {
    this._processSingleCallback = cb;

    return this;
  }

  handleResultCallback(cb) {
    this._handleResultCallback = cb;
    return this;
  }
}

class Processor {
  constructor() {
    this.completeCb = [];
  }

  timeout(timeout) {
    this._timeout = timeout;
    return this;
  }

  interval(interval) {
    this._interval = interval;
    return this;
  }

  process(subject) {
    const { _interval, _timeout } = this;

    this._subject = subject;

    this._observable = Observable.interval(_interval)
      .timeout(_timeout)
      .zip(subject.asObservable(), (a, b) => b)
      .map(subject._processSingleCallback, subject)
      .merge()
      .do(subject._handleResultCallback.bind(subject));

    return this;
  }

  complete(cb) {
    return this.subscribe(null, null, cb);
  }

  next(cb) {
    return this.subscribe(cb, null, null);
  }

  error(cb) {
    return this.subscribe(null, cb, null);
  }

  subscribe(next, error, complete) {
    const { _observable } = this;

    assert(_observable != null);

    this._observable.subscribe(next, error, complete);

    return this;
  }
}

module.exports = {
  Processor,
  Subject
};
