import SearchModule from "@/components/SearchModule";

const BottomSearchSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12">
            Find Website Design Leads <span className="text-gradient">in Your Area</span>
          </h2>
          
          <SearchModule />
        </div>
      </div>
    </section>
  );
};

export default BottomSearchSection;
