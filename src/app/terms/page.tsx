import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Welcome to AskAroundApp! These terms and conditions outline the
            rules and regulations for the use of our application.
          </p>

          <h3 className="font-semibold text-foreground">
            1. Acceptance of Terms
          </h3>
          <p>
            By accessing and using AskAroundApp, you accept and agree to be
            bound by the terms and provision of this agreement.
          </p>

          <h3 className="font-semibold text-foreground">2. User Conduct</h3>
          <p>
            You agree to use the app in a manner that is lawful, respectful, and
            in accordance with our community guidelines. Harassment, spam, and
            illegal activities are strictly prohibited.
          </p>

          <h3 className="font-semibold text-foreground">3. Content</h3>
          <p>
            You are responsible for the content you post. By posting content,
            you grant us a non-exclusive, royalty-free license to use,
            reproduce, and display it in connection with the service.
          </p>

          <h3 className="font-semibold text-foreground">
            4. Limitation of Liability
          </h3>
          <p>
            The information on AskAroundApp is provided on an "as is" basis. We
            are not liable for any inaccuracies or for any damages arising from
            the use of the app.
          </p>

          <h3 className="font-semibold text-foreground">5. Changes to Terms</h3>
          <p>
            We reserve the right to modify these terms at any time. We will do
            our best to notify you of any changes, but it is your responsibility
            to review them periodically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
