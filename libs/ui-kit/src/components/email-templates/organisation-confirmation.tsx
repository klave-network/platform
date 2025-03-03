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

export const OrganisationConfirmationEmail = ({ userSlug, orgSlug }: { userSlug: string, orgSlug: string }) => {

    return (
        <Html lang="en">
            <Head/>
            <Preview>Successfully created your organisation</Preview>
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
                                Your organisation is now live on Klave!
                            </Heading>
                        </Section>

                        <Section className="text-body-grey">
                            <Text>
                                Hi {userSlug},
                            </Text>
                            <Text>
                                Congratulations! Your organisation, {orgSlug}, is now live on Klave.
                            </Text>
                            <Text>
                                What’s Next?
                            </Text>
                            <ul className="text-sm text-body-grey">
                                <li>
                                    Start adding team members to collaborate efficiently
                                </li>
                                <li>
                                    Customise your organisation profile to stand out
                                </li>
                                <li>
                                    Explore Klave’s features designed to streamline your workflows
                                </li>
                            </ul>
                            <Text>
                                We’re also excited to feature your company name and logo on Klave,
                                increasing your visibility within our community. You can review
                                or update this in your account settings anytime.
                            </Text>
                            <Text>
                                <Button
                                    href={`https://app.klave.com/organisation/${orgSlug}/settings`}
                                    className="bg-klave-light-blue text-klave-dark-blue rounded-md font-bold px-6 py-2.5"
                                >
                                    Manage your organisation
                                </Button>
                            </Text>
                            <Text>
                                Thank you for choosing Klave. We’re thrilled to support your journey!
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

OrganisationConfirmationEmail.PreviewProps = {
    userSlug: 'damitzi',
    orgSlug: 'damitzi-org'
};

export default OrganisationConfirmationEmail;
