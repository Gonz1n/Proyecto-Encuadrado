import { CenterProfilePage } from '@/features/public-booking/components/center-profile/center-profile-page'
import { generateCenterMetadata } from '@/features/center/api/public-center-server'

export const generateMetadata = generateCenterMetadata

export default function Page() {
  return <CenterProfilePage />
}
