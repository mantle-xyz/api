// docs:
// https://skfc4x16la.larksuite.com/wiki/JjAhwRy9hiw1cykzI26uuxtDsr9?chunked=false
// https://docs.mantle.xyz/governance/parameters/treasury

export default function fetchTreasuryWallets(): Promise<string[]> {
  return fetch(
    'https://cms.mantle.xyz/items/treasury_wallets?limit=1000&fields=wallet&sort=wallet&page=1'
  )
    .then((res) => res.json())
    .then((result) => result.data.map((d: { wallet: string }) => d.wallet.toLowerCase()));
}
