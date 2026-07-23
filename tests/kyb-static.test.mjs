import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const kyb = readFileSync(new URL('../lib/api/kyb.ts', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../app/dashboard/business/page.tsx', import.meta.url), 'utf8')

test('KYB API client posts the Nest CreateKybSessionDto and unwraps the verification envelope', () => {
  for (const field of ['organization_id', 'business_name', 'registration_number', 'country', 'entity_type']) {
    assert.match(kyb, new RegExp(`${field}: string`))
  }

  assert.match(kyb, /body: JSON\.stringify\(input\)/)
  assert.match(kyb, /interface KybVerificationEnvelope/)
  assert.match(kyb, /verification: KybVerification/)
  assert.match(kyb, /result\.data\?\.verification/)
  assert.match(kyb, /organizationId: verification\.organization_id/)
  assert.match(kyb, /failureReason: verification\.rejection_reason \?\? null/)
})

test('KYB API client uses shared apiRequest and expected endpoints', () => {
  assert.match(kyb, /import \{ apiRequest, type ApiResponse \} from "\.\/client"/)
  assert.match(kyb, /apiRequest<KybVerificationEnvelope>\(\s*"\/kyb\/session"/)
  assert.match(kyb, /`\/kyb\/status\/\$\{encodeURIComponent\(organizationId\)\}`/)
  assert.match(kyb, /\{ method: "GET" \}/)
})

test('KYB API client maps all backend statuses', () => {
  for (const status of ['pending', 'in_review', 'verified', 'rejected']) {
    assert.match(kyb, new RegExp(status))
  }
})

test('business dashboard builds the required KYB DTO from profile fields and polls by organization UUID', () => {
  assert.match(dashboard, /const companyOrganizationId =/)
  assert.match(dashboard, /UUID_PATTERN\.test\(companyProfile\.id\)/)
  assert.match(dashboard, /const buildKybSessionInput/)
  assert.match(dashboard, /organization_id: companyOrganizationId/)
  assert.match(dashboard, /business_name: businessName/)
  assert.match(dashboard, /registration_number: registrationNumber/)
  assert.match(dashboard, /country,/)
  assert.match(dashboard, /entity_type: entityType/)
  assert.doesNotMatch(dashboard, /setKybOrganizationId\(activeBusinessWallet\)/)
})

test('business dashboard gates enterprise creation and fund release unless verified', () => {
  assert.match(dashboard, /const isKybVerified = kybStatus === "verified"/)
  assert.match(dashboard, /Enterprise agreement creation is blocked until your business verification is approved\./)
  assert.match(dashboard, /activePermissions\.release && isKybVerified/)
})

test('business dashboard handles KYB refresh, rejected status, expired sessions, and retry flow', () => {
  assert.match(dashboard, /refreshKybStatus/)
  assert.match(dashboard, /setKybStatus\(result\.data\.status\)/)
  assert.match(dashboard, /setKybSessionExpired\(Boolean\(result\.data\.sessionExpired\)\)/)
  assert.match(dashboard, /Retry verification/)
})

test('starting verification transitions pending sessions into review without assuming provider flow URLs', () => {
  assert.match(dashboard, /result\.data\.status === "pending" \? "in_review" : result\.data\.status/)
  assert.doesNotMatch(dashboard, /redirectUrl \|\| result\.data\.verificationUrl/)
})
