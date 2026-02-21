const Footer = () => {
    return (
        <footer className="mt-auto py-6 border-t border-white/10 backdrop-blur-sm bg-black/20">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                    <p className="text-white/60">
                        Developed with ❤️ by{' '}
                        <a
                            href="mailto:rbkhan00009@gmail.com?subject=Project%20Inquiry%20from%20Basudevpur%20HS"
                            className="text-school-primary hover:text-school-secondary transition-colors font-semibold"
                        >
                            MD. Rakibul Hasan
                        </a>
                    </p>
                    <span className="hidden md:block text-white/20">|</span>
                    <div className="flex items-center gap-4 text-white/60">
                        <a href="tel:+8801774471120" className="hover:text-white transition-colors flex items-center gap-1">
                            <span>📞</span> +880 1774-471120
                        </a>
                        <a href="mailto:rbkhan00009@gmail.com" className="hover:text-white transition-colors flex items-center gap-1">
                            <span>✉️</span> rbkhan00009@gmail.com
                        </a>
                    </div>
                </div>
                <p className="text-[10px] text-white/40 mt-3 uppercase tracking-[0.2em]">
                    Premium School Management System • Need a custom solution? Let's talk.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
