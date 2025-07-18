export default function Footer() {
  return (
    <footer className="w-full border-t border-border py-6 text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} AEROHUB. All rights reserved.</p>

        <p className="flex items-center gap-1">
          Experiencing issues? Contact ItsSkelly on{" "}
          <a
            href="https://discordapp.com/users/506152266940809227"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary"
          >
            Discord
          </a>
        </p>
      </div>
    </footer>
  );
}
