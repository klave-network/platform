import {
    Html,
    Body,
    Tailwind,
    Text,
    Container,
    Img,
    Heading,
    Head,
    Preview,
    Hr,
    Section
} from '@react-email/components';

export const VerificationCodeEmail = (props: { title: string, code: string }) => {
    const { title, code } = props;

    return (
        <Html lang="en">
            <Head />
            <Preview>Your login code for Klave</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                'off-black': '#0E1218',
                                'body-grey': '#3F4951',
                                'klave-dark-blue': '#00021A',
                                'klave-light-blue': '#00BFFF',
                                'klave-cyan': '#00FFD5',
                                'klave-purple': '#B291ED'
                            }
                        }
                    }
                }}
            >
                <Body className="bg-white my-12 mx-auto font-sans">
                    <Container className="p-8">
                        <Section>
                            <Img
                                src="https://media.secretarium.org/static/klave-gradient-logo.svg"
                                alt="Klave logo"
                                className="w-1/3"
                            />
                        </Section>

                        <Section>
                            <Heading className="text-xl pt-4 text-off-black">
                                {title}
                            </Heading>
                        </Section>

                        <Section className="text-body-grey">
                            <Text>
                                Enter the following code in your open browser window to sign in to Klave.
                            </Text>
                        </Section>

                        <Section className="bg-gray-200 rounded-sm flex items-center justify-center">
                            <Text className="text-xl font-medium font-mono">
                                {code}
                            </Text>
                        </Section>

                        <Section className="text-body-grey">
                            <Text>
                                Best,
                                <br />
                                The Klave team
                            </Text>
                        </Section>

                        <Hr className="text-gray-400" />

                        <Section>
                            <Text className="text-gray-400">
                                &copy; {new Date().getFullYear()} Secretarium Ltd. All rights reserved.
                            </Text>
                            <Text className="text-gray-400">
                                Registered 10406018 in England and Wales. 8-9 Well Court, London, United Kingdom, EC4M 9DN
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

VerificationCodeEmail.PreviewProps = {
    title: 'Your login code for Klave',
    code: '123-456-789'
};

export default VerificationCodeEmail;
