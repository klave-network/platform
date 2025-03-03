import {
    Html,
    Body,
    Button,
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

export const RegistrationFollowUpEmail = ({ slug }: { slug: string }) => {

    return (
        <Html lang="en">
            <Head/>
            <Preview>Ready to create your organisation?</Preview>
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
                                Welcome to Klave! Ready to create your organisation?
                            </Heading>
                        </Section>

                        <Section className="text-body-grey">
                            <Text>
                                Hi {slug},
                            </Text>
                            <Text>
                                Welcome to Klave! We’re excited to have you on board.
                            </Text>
                            <Text>
                                To help you get the most out of Klave, we invite you
                                to create an organisation. By setting up your organisation,
                                you’ll unlock powerful features like team collaboration,
                                project management, and more.
                            </Text>
                            <Text>
                                Why create an organisation on Klave?
                            </Text>
                            <ul className="text-sm text-body-grey">
                                <li>
                                    It’s completely free
                                </li>
                                <li>
                                    Boost your team's productivity with centralised management
                                </li>
                                <li>
                                    Team collaboration is made incredibly easy
                                </li>
                                <li>
                                    Increase visibility with your company name and logo featured on Klave
                                </li>
                            </ul>
                            <Text>
                                <Button
                                    href="https://app.klave.com/organisation/new"
                                    className="bg-klave-light-blue text-klave-dark-blue rounded-md font-bold px-6 py-2.5"
                                >
                                    Create your organisation now
                                </Button>
                            </Text>
                            <Text>
                                Feel free to reach out if you have any questions. We’re here to help!
                            </Text>
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

RegistrationFollowUpEmail.PreviewProps = {
    slug: 'damitzi'
};

export default RegistrationFollowUpEmail;
