/**
 * @license
 * Copyright © 2017-2018 Moov Corporation.  All rights reserved.
 */
import AppModelBase, { LocationModel } from '../../src/model/AppModelBase'
import UserModelBase from '../../src/model/UserModelBase'
import { types } from 'mobx-state-tree'

describe('AppModelBase', () => {
  it('should provide a canonical url for amp pages', () => {
    const app = AppModelBase.create({
      location: {
        pathname: '/foo.amp',
        search: '?bar=1',
        hostname: 'localhost',
        protocol: 'https:'
      }
    })

    expect(app.canonicalURL).toBe('https://localhost/foo?bar=1')
  })

  describe('uri', () => {
    it('should include hostname and search', () => {
      expect(
        AppModelBase.create({
          location: { protocol: 'https', pathname: '/foo', search: '?bar=true' }
        }).uri
      ).toBe('/foo?bar=true')
    })
  })

  describe('productThumbnail', () => {
    it('should be cleared by clearProductThumbnail', () => {
      const app = AppModelBase.create({ productThumbnail: '/foo' })
      app.clearProductThumbnail()
      expect(app.productThumbnail).toBe(null)
    })
  })

  describe('applyState', () => {
    it('should retain cart and user when action = POP', () => {
      const app = AppModelBase.create({
        user: {
          email: 'user@domain.com'
        },
        cart: {
          items: [{ id: '1' }]
        }
      })

      const user = app.user.toJSON()
      const cart = app.cart.toJSON()

      app.applyState({ page: 'Home', loading: false, cart: null, user: null }, 'POP')

      expect(app.user.toJSON()).toEqual(user)
      expect(app.cart.toJSON()).toEqual(cart)
    })

    describe('auditPatchOnPop', () => {
      let model, shouldApplyPatchOnPop

      beforeEach(() => {
        const ChildModel = types
          .model('ChildModel', {
            value: types.string
          })
          .views(self => ({
            shouldApplyPatchOnPop: patch => shouldApplyPatchOnPop(patch)
          }))

        const AppModel = types.compose(
          AppModelBase,
          types.model('AppModel', {
            child: ChildModel
          })
        )

        model = AppModel.create({
          child: {
            value: 'test'
          }
        })
      })

      it('should not apply the patch when shouldApplyPatchOnPop returns false', done => {
        shouldApplyPatchOnPop = jest.fn(() => false)
        model.applyState({ page: 'Home', child: { value: 'updated' } }, 'POP')
        expect(shouldApplyPatchOnPop).toHaveBeenCalled()

        setImmediate(() => {
          expect(model.child.value).toBe('test')
          done()
        })
      })

      it('should not apply the patch when shouldApplyPatchOnPop returns true', done => {
        shouldApplyPatchOnPop = jest.fn(() => true)
        model.applyState({ page: 'Home', child: { value: 'updated' } }, 'POP')
        expect(shouldApplyPatchOnPop).toHaveBeenCalled()
        setImmediate(() => {
          expect(model.child.value).toBe('updated')
          done()
        })
      })
    })

    it('should apply all props when action is omitted', () => {
      const app = AppModelBase.create({
        user: {
          email: 'user@domain.com'
        },
        loading: false
      })

      app.applyState({ loading: true, user: null })

      expect(app.user).toBeNull()
      expect(app.loading).toBe(true)
    })
  })

  describe('clearProductThumbnail', () => {
    it('should set productThumbnail to null', () => {
      const app = AppModelBase.create({
        productThumbnail: '/test.png'
      })
      app.clearProductThumbnail()
      expect(app.productThumbnail).toBeNull()
    })
  })

  describe('onError', () => {
    it('should set the page to error and capture the message and stack', () => {
      const app = AppModelBase.create({ page: 'Home' })
      const error = new Error('test')
      app.onError(error)
      expect(app.page).toBe('Error')
      expect(app.error).toBe(error.message)
      expect(app.stack).toBe(error.stack)
    })
  })

  describe('urlBase', () => {
    it('should normalize the protocol when it has a colon', () => {
      const model = LocationModel.create({
        protocol: 'https:',
        hostname: 'domain.com',
        pathname: '/',
        search: ''
      })

      expect(model.urlBase).toBe('https://domain.com')
    })
    it('should normalize the protocol when it does not have a colon', () => {
      const model = LocationModel.create({
        protocol: 'https',
        hostname: 'domain.com',
        pathname: '/',
        search: ''
      })

      expect(model.urlBase).toBe('https://domain.com')
    })
    it('should include the port', () => {
      const model = LocationModel.create({
        protocol: 'https:',
        hostname: 'domain.com',
        port: '1234',
        pathname: '/',
        search: ''
      })

      expect(model.urlBase).toBe('https://domain.com:1234')
    })
  })
  describe('signIn', () => {
    it('should set the user', () => {
      const app = AppModelBase.create({})

      app.signIn(
        UserModelBase.create({
          email: 'test@domain.com'
        })
      )

      expect(app.user.email).toBe('test@domain.com')
    })
  })
  describe('signOut', () => {
    it('should set user to null', () => {
      const app = AppModelBase.create({
        user: {
          email: 'test@domain.com'
        }
      })

      app.signOut()
      expect(app.user).toBeNull()
    })
  })
  describe('setUser', () => {
    it('should set the user', () => {
      const app = AppModelBase.create({})

      app.setUser(
        UserModelBase.create({
          email: 'test@domain.com'
        })
      )

      expect(app.user.email).toBe('test@domain.com')
    })
  })
  describe('setOffline', () => {
    it('should toggle offline', () => {
      const app = AppModelBase.create({
        offline: false
      })

      app.setOffline(true)
      expect(app.offline).toBe(true)
      app.setOffline(false)
      expect(app.offline).toBe(false)
    })
  })
})
