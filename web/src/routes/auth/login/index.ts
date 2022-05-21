import type { RequestHandler } from '@sveltejs/kit';
import { serverEndpoint } from '$lib/constants';
import * as cookie from 'cookie'
import { getRequest, putRequest } from '$lib/api';

type LoggedInUser = {
  accessToken: string;
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export const post: RequestHandler = async ({ request }) => {
  const form = await request.formData();

  const email = form.get('email')
  const password = form.get('password')

  const payload = {
    email,
    password,
  }

  const res = await fetch(`${serverEndpoint}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 201) {
    // Login success
    const loggedInUser = await res.json() as LoggedInUser;

    /**
     * Support legacy users with two scenario
     * 
     * Scenario 1 - If one user exists on the server - make the user admin and ask for name.
     * Scenario 2 - After assigned as admin, scenario 1 user not complete update form with names
     * Scenario 3 - If two users exists on the server and no admin - ask to choose which one will be made admin
     */


    // check how many user on the server
    const { userCount } = await getRequest('user/count', '');
    const { userCount: adminUserCount } = await getRequest('user/count?isAdmin=true', '')
    /**
     * Scenario 1 handler
     */
    if (userCount == 1 && !loggedInUser.isAdmin) {

      const updatedUser = await putRequest('user', {
        id: loggedInUser.userId,
        isAdmin: true
      }, loggedInUser.accessToken)


      /**
      * Scenario 2 handler for current admin user
      */
      let bodyResponse = { success: true, needUpdate: false }

      if (loggedInUser.firstName == "" || loggedInUser.lastName == "") {
        bodyResponse = { success: false, needUpdate: true }
      }


      return {
        status: 200,
        body: {
          ...bodyResponse,
          user: {
            id: updatedUser.userId,
            accessToken: loggedInUser.accessToken,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            isAdmin: updatedUser.isAdmin,
            email: updatedUser.email,
          },
        },
        headers: {
          'Set-Cookie': cookie.serialize('session', JSON.stringify(
            {
              id: updatedUser.userId,
              accessToken: loggedInUser.accessToken,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              isAdmin: updatedUser.isAdmin,
              email: updatedUser.email,
            }), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30,
          })
        }
      }
    }


    /**
    * Scenario 3 handler
    */
    if (userCount >= 2 && adminUserCount == 0) {
      return {
        status: 200,
        body: {
          needSelectAdmin: true,
          user: {
            id: loggedInUser.userId,
            accessToken: loggedInUser.accessToken,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            isAdmin: loggedInUser.isAdmin,
            email: loggedInUser.userEmail
          },
          success: 'success'
        },
        headers: {
          'Set-Cookie': cookie.serialize('session', JSON.stringify(
            {
              id: loggedInUser.userId,
              accessToken: loggedInUser.accessToken,
              firstName: loggedInUser.firstName,
              lastName: loggedInUser.lastName,
              isAdmin: loggedInUser.isAdmin,
              email: loggedInUser.userEmail
            }), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30,
          })
        }
      }
    }

    /**
    * Scenario 2 handler
    */
    if (loggedInUser.firstName == "" || loggedInUser.lastName == "") {
      return {
        status: 200,
        body: {
          needUpdate: true,
          user: {
            id: loggedInUser.userId,
            accessToken: loggedInUser.accessToken,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            isAdmin: loggedInUser.isAdmin,
            email: loggedInUser.userEmail
          },
        },
        headers: {
          'Set-Cookie': cookie.serialize('session', JSON.stringify(
            {
              id: loggedInUser.userId,
              accessToken: loggedInUser.accessToken,
              firstName: loggedInUser.firstName,
              lastName: loggedInUser.lastName,
              isAdmin: loggedInUser.isAdmin,
              email: loggedInUser.userEmail
            }), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30,
          })
        }
      }
    }



    return {
      status: 200,
      body: {
        user: {
          id: loggedInUser.userId,
          accessToken: loggedInUser.accessToken,
          firstName: loggedInUser.firstName,
          lastName: loggedInUser.lastName,
          isAdmin: loggedInUser.isAdmin,
          email: loggedInUser.userEmail
        },
        success: 'success'
      },
      headers: {
        'Set-Cookie': cookie.serialize('session', JSON.stringify(
          {
            id: loggedInUser.userId,
            accessToken: loggedInUser.accessToken,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            isAdmin: loggedInUser.isAdmin,
            email: loggedInUser.userEmail,
          }), {
          // send cookie for every page
          path: '/',

          // server side only cookie so you can't use `document.cookie`
          httpOnly: true,

          // only requests from same site can send cookies
          // and serves to protect from CSRF
          // https://developer.mozilla.org/en-US/docs/Glossary/CSRF
          sameSite: 'strict',

          // set cookie to expire after a month
          maxAge: 60 * 60 * 24 * 30,
        })
      }
    }

  } else {
    return {
      status: 400,
      body: {
        error: 'Incorrect email or password'
      }
    }
  }


}