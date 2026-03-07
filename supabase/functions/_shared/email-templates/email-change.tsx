/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email for SkipTheApp 📧</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>💚 SkipTheApp</Text>
        <Heading style={h1}>Confirm your new email 📧</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>
          Tap below to confirm and you're all set:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't request this? Please secure your account right away.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '16px', fontWeight: 'bold' as const, color: 'hsl(346, 77%, 58%)', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(350, 30%, 15%)', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '15px', color: 'hsl(350, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(346, 77%, 58%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(346, 77%, 58%)', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none' }
const hr = { borderColor: 'hsl(350, 25%, 88%)', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
