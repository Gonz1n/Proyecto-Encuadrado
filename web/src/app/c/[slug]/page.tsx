import { CenterProfilePage } from '@/features/public-booking/center-profile-page'
import { generateCenterMetadata } from '@/lib/server-api'

export const generateMetadata = generateCenterMetadata

export default function Page() {
  return <CenterProfilePage />
}
