
/*
web:dev:   name: 'yz13',
web:dev:   email: 'owner@yz13.dev',
web:dev:   emailVerified: false,
web:dev:   image: null,
web:dev:   createdAt: '2026-06-23T03:28:40.449Z',
web:dev:   updatedAt: '2026-06-23T03:28:40.449Z',
web:dev:   username: 'yz13',
web:dev:   displayUsername: 'yz13',
web:dev:   id: '69MHQFMho7zwdfophrMFt45a5ilMa0qb'
*/
export type User = {
  id: string
  email: string
  emailVerified: string | null
  name: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  username: string | null
  displayUsername: string | null
}
