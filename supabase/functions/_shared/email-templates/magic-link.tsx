/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SkipTheApp login link ✨</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>💚 SkipTheApp</Text>
        <Heading style={h1}>Your login link is here ✨</Heading>
        <Text style={text}>
          Tap the button below to jump back into SkipTheApp. This link expires shortly, so don't wait!
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In Now
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't request this? No worries — just ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '16px', fontWeight: 'bold' as const, color: 'hsl(346, 77%, 58%)', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(350, 30%, 15%)', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '15px', color: 'hsl(350, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(346, 77%, 58%)', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none' }
const hr = { borderColor: 'hsl(350, 25%, 88%)', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
