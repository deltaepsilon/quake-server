/*---------------------
	:: User
	-> model
---------------------*/
module.exports = {

	attributes	: {
    provider: 'STRING',
    id: 'STRING',
    displayName: 'STRING',
    name: { familyName: 'STRING', givenName: 'STRING' },
    emails: [ { value: 'STRING' } ],
      _raw: 'STRING',
    _json: {
      id: 'STRING',
      email: 'STRING',
      verified_email: 'BOOLEAN',
      name: 'STRING',
      given_name: 'STRING',
      family_name: 'STRING',
      link: 'STRING',
      picture: 'STRING',
      gender: 'STRING',
      birthday: 'STRING',
      locale: 'STRING'
    },
    stripe: {
      publicKey: 'STRING',
      secretKey: 'STRING'
    },
    subscription: {
      active: 'BOOLEAN',
      stripeUser: {

      }
    }
  }


    // Simple attribute:
		// name: 'STRING',

		// Or for more flexibility:
		// phoneNumber: {
		//	type: 'STRING',
		//	defaultValue: '555-555-5555'
		// }

};