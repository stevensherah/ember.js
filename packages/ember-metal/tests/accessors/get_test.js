import { ENV } from 'ember-environment';
import {
  get,
  getWithDefault,
  Mixin,
  observer,
} from '../..';
import { moduleFor, AbstractTestCase } from 'internal-test-helpers';

function aget(x, y) { return x[y]; }

moduleFor('Ember.get', class extends AbstractTestCase {
  ['@test should get arbitrary properties on an object'](assert) {
    let obj = {
      string: 'string',
      number: 23,
      boolTrue: true,
      boolFalse: false,
      nullValue: null
    };

    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      assert.equal(get(obj, key), obj[key], key);
    }
  }

  ['@test should not access a property more than once'](assert) {
    let count = 0;
    let obj = {
      get id() { return ++count; }
    };

    get(obj, 'id');

    assert.equal(count, 1);
  }

  ['@test should call unknownProperty on watched values if the value is undefined using getFromEmberMetal()/Ember.set()'](assert) {
    let obj = {
      unknownProperty(key) {
        assert.equal(key, 'foo', 'should pass key');
        return 'FOO';
      }
    };
    assert.equal(get(obj, 'foo'), 'FOO', 'should return value from unknown');
  }

  ['@test should call unknownProperty on watched values if the value is undefined using accessors'](assert) {
    if (ENV.USES_ACCESSORS) {
      let obj = {
        unknownProperty(key) {
          assert.equal(key, 'foo', 'should pass key');
          return 'FOO';
        }
      };
      assert.equal(aget(obj, 'foo'), 'FOO', 'should return value from unknown');
    } else {
      assert.ok('SKIPPING ACCESSORS');
    }
  }

  ['@test warn on attempts to call get with no arguments']() {
    expectAssertion(function() {
      get('aProperty');
    }, /Get must be called with two arguments;/i);
  }

  ['@test warn on attempts to call get with only one argument']() {
    expectAssertion(function() {
      get('aProperty');
    }, /Get must be called with two arguments;/i);
  }

  ['@test warn on attempts to call get with more then two arguments']() {
    expectAssertion(function() {
      get({}, 'aProperty', true);
    }, /Get must be called with two arguments;/i);
  }

  ['@test warn on attempts to get a property of undefined']() {
    expectAssertion(function() {
      get(undefined, 'aProperty');
    }, /Cannot call get with 'aProperty' on an undefined object/i);
  }

  ['@test warn on attempts to get a property path of undefined']() {
    expectAssertion(function() {
      get(undefined, 'aProperty.on.aPath');
    }, /Cannot call get with 'aProperty.on.aPath' on an undefined object/);
  }

  ['@test warn on attempts to get a property of null']() {
    expectAssertion(function() {
      get(null, 'aProperty');
    }, /Cannot call get with 'aProperty' on an undefined object/);
  }

  ['@test warn on attempts to get a property path of null']() {
    expectAssertion(function() {
      get(null, 'aProperty.on.aPath');
    }, /Cannot call get with 'aProperty.on.aPath' on an undefined object/);
  }

  ['@test warn on attempts to use get with an unsupported property path']() {
    let obj = {};
    expectAssertion(() => get(obj, null),      /The key provided to get must be a string, you passed null/);
    expectAssertion(() => get(obj, NaN),       /The key provided to get must be a string, you passed NaN/);
    expectAssertion(() => get(obj, undefined), /The key provided to get must be a string, you passed undefined/);
    expectAssertion(() => get(obj, false),     /The key provided to get must be a string, you passed false/);
    expectAssertion(() => get(obj, 42),        /The key provided to get must be a string, you passed 42/);
    expectAssertion(() => get(obj, ''), /Cannot call `Ember.get` with an empty string/);
  }

  // ..........................................................
  // BUGS
  //

  ['@test (regression) watched properties on unmodified inherited objects should still return their original value']() {
    let MyMixin = Mixin.create({
      someProperty: 'foo',
      propertyDidChange: observer('someProperty', () => {})
    });

    let baseObject = MyMixin.apply({});
    let theRealObject = Object.create(baseObject);

    equal(get(theRealObject, 'someProperty'), 'foo', 'should return the set value, not false');
  }
});

moduleFor('Ember.getWithDefault', class extends AbstractTestCase {
  ['@test should get arbitrary properties on an object'](assert) {
    let obj = {
      string: 'string',
      number: 23,
      boolTrue: true,
      boolFalse: false,
      nullValue: null
    };

    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      assert.equal(getWithDefault(obj, key, 'fail'), obj[key], key);
    }

    obj = {
      undef: undefined
    };

    assert.equal(getWithDefault(obj, 'undef', 'default'), 'default', 'explicit undefined retrieves the default');
    assert.equal(getWithDefault(obj, 'not-present', 'default'), 'default', 'non-present key retrieves the default');
  }

  ['@test should call unknownProperty if defined and value is undefined'](assert) {
    let obj = {
      count: 0,
      unknownProperty(key) {
        equal(key, 'foo', 'should pass key');
        this.count++;
        return 'FOO';
      }
    };

    assert.equal(get(obj, 'foo'), 'FOO', 'should return value from unknown');
    assert.equal(obj.count, 1, 'should have invoked');
  }

  ['@test if unknownProperty is present, it is called using getFromEmberMetal()/Ember.set()'](assert) {
    let obj = {
      unknownProperty(key) {
        if (key === 'foo') {
          equal(key, 'foo', 'should pass key');
          return 'FOO';
        }
      }
    };
    assert.equal(getWithDefault(obj, 'foo', 'fail'), 'FOO', 'should return value from unknownProperty');
    assert.equal(getWithDefault(obj, 'bar', 'default'), 'default', 'should convert undefined from unknownProperty into default');
  }

  ['@test if unknownProperty is present, it is called using accessors'](assert) {
    if (ENV.USES_ACCESSORS) {
      let obj = {
        unknownProperty(key) {
          if (key === 'foo') {
            assert.equal(key, 'foo', 'should pass key');
            return 'FOO';
          }
        }
      };
      assert.equal(aget(obj, 'foo', 'fail'), 'FOO', 'should return value from unknownProperty');
      assert.equal(aget(obj, 'bar', 'default'), 'default', 'should convert undefined from unknownProperty into default');

    } else {
      assert.ok('SKIPPING ACCESSORS');
    }
  }

  // ..........................................................
  // BUGS
  //

  ['@test (regression) watched properties on unmodified inherited objects should still return their original value'](assert) {
    let MyMixin = Mixin.create({
      someProperty: 'foo',
      propertyDidChange: observer('someProperty', () => { /* nothing to do */})
    });

    let baseObject = MyMixin.apply({});
    let theRealObject = Object.create(baseObject);

    assert.equal(getWithDefault(theRealObject, 'someProperty', 'fail'), 'foo', 'should return the set value, not false');
  }
});

