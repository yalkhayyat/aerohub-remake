export default function Footer() {
  return (
    <footer className="w-full border-t border-border py-6 text-sm text-muted-foreground">
      <div className="w-full flex flex-col md:flex-row items-center justify-between px-4 md:px-24 lg:px-48">
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
